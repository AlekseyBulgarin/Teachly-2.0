export type AuthenticatedPrincipal = {
  provider: string;
  subject: string;
  userId: string;
  userType: 'teacher' | 'student';
};

export type ExternalPrincipal = {
  provider: string;
  subject: string;
};
