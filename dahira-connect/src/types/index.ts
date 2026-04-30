export type Dahira = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type Member = {
  id: string;
  dahira_id: string;
  full_name: string;
  created_at: string;
};

export type Contribution = {
  id: string;
  member_id: string;
  month: string;
  paid: boolean;
  amount: number;
};
