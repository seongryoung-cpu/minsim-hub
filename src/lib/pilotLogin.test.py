import asyncio, json, base64, time, unittest
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path('/tmp/browser/pilot-login-regression')
BASE.mkdir(parents=True, exist_ok=True)
# Isolated responses: no account credentials or production writes.
USER = {'id':'184a63e3-a501-4504-88bc-47ec1b72c085','aud':'authenticated','role':'authenticated','email':'regression@example.invalid','app_metadata':{'provider':'email'},'user_metadata':{},'created_at':'2026-01-01T00:00:00Z'}
def encode(value):
    return base64.urlsafe_b64encode(json.dumps(value).encode()).decode().rstrip('=')
SESSION = {'access_token':encode({'alg':'HS256','typ':'JWT'})+'.'+encode({'sub':USER['id'],'exp':int(time.time())+3600,'role':'authenticated'})+'.test-only','refresh_token':'test-only','expires_in':3600,'token_type':'bearer','user':USER}
EVENT = {'id':'ab731221-6c99-404b-8466-894f77ad2cec','slug':'login-regression','title':'신청 로그인 검증 행사','summary':'','event_at':'2026-12-05T04:00:00Z','venue':'검증 장소','apply_closes_at':'2026-12-01T00:00:00Z','announce_at':None,'capacity':30,'agenda_id':None,'schools':['검증대학교'],'allow_public':True,'is_published':True,'personal_purged_at':None}

async def check_login_submit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={'width':1280,'height':1800})
        page = await context.new_page()
        submissions = []
        application = None
        async def events(route):
            await route.fulfill(json=EVENT)
        async def mine(route):
            await asyncio.sleep(2)
            await route.fulfill(json=application)
        async def apply(route):
            nonlocal application
            payload = route.request.post_data_json
            submissions.append(payload)
            application = {'id':'9731997e-bf00-48e0-bf36-b1be7b162040','name':payload['p_name'],'phone':payload['p_phone'],'is_student':payload['p_is_student'],'school':payload['p_school'],'major':payload['p_major'],'grade':payload['p_grade'],'heard_from':payload['p_heard_from'],'consent_photo':payload['p_consent_photo'],'status':'applied','created_at':'2026-10-26T00:00:00Z'}
            await route.fulfill(json={'ok':True,'updated':False})
        async def isolate_database(route):
            url = route.request.url
            if '/profiles?' in url:
                await route.fulfill(json={'user_id':USER['id'],'display_name':'검증계정','verification_level':'social'})
            else:
                await route.fulfill(json=[])
        await page.route('**/rest/v1/**', isolate_database)
        await page.route('**/auth/v1/user', lambda r: r.fulfill(json=USER))
        await page.route('**/rest/v1/pilot_events?*', events)
        await page.route('**/rest/v1/pilot_applications?*', mine)
        await page.route('**/rest/v1/rpc/pilot_application_count', lambda r: r.fulfill(json=0))
        await page.route('**/rest/v1/rpc/apply_pilot', apply)
        await page.route('**/auth/v1/token?grant_type=password', lambda r: r.fulfill(json=SESSION))
        await page.goto('http://localhost:8080/pilot/login-regression', wait_until='networkidle')
        await page.get_by_placeholder('홍길동').fill('검증신청자')
        await page.get_by_placeholder('010-1234-5678').fill('01000000000')
        await page.locator('select').select_option(label='검증대학교')
        await page.get_by_role('checkbox').first.check()
        await page.get_by_role('button',name='신청하기',exact=True).click()
        await page.get_by_role('button',name='로그인 / 가입하기',exact=True).click()
        await page.get_by_role('button',name='이메일로 로그인',exact=True).click()
        await page.get_by_placeholder('email@example.com').fill('regression@example.invalid')
        await page.get_by_placeholder('••••••••').fill('test-only-password')
        await page.get_by_role('button',name='로그인',exact=True).click()
        await page.wait_for_timeout(6500)
        assert len(submissions) == 1, 'Login must resume the application exactly once'
        assert submissions[0]['p_name'] == '검증신청자'
        assert submissions[0]['p_phone'] == '010-0000-0000'
        assert submissions[0]['p_school'] == '검증대학교'
        assert submissions[0]['p_consent_privacy'] is True
        await page.get_by_text('신청했어요', exact=True).wait_for()
        assert await page.get_by_text('검증신청자',exact=True).is_visible()
        print('PASS: login resumes once with the original application and reads back the saved result')
        await page.screenshot(path=str(BASE/'result.png'))
        await browser.close()
class PilotLoginRegression(unittest.TestCase):
    def test_login_preserves_and_submits_application(self):
        asyncio.run(check_login_submit())

if __name__ == '__main__':
    unittest.main()
