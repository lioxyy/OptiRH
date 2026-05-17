export type CandidateStage = 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected'
export type CandidateStatus = 'active' | 'closed'

export type Candidate = {
  id: number
  name: string
  role: string
  source: string
  stage: CandidateStage
  status: CandidateStatus
  score: number
  recruiter: string
  lastUpdate: string
  daysInStage: number
  timeline: Array<{ label: string; detail: string; completed: boolean }>
}
