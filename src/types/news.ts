export interface NewsArticle {
  id: string;
  candidateId: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  category: 'policy' | 'campaign' | 'interview' | 'general';
  url?: string;
}

export interface CandidateNews {
  candidateId: string;
  candidateName: string;
  party: string;
  partyColor: string;
  articles: NewsArticle[];
}
