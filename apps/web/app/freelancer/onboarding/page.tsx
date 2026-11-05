import { OnboardingWizard } from '../../../components/Freelancer/OnboardingWizard.js';

export const metadata = {
  title: 'পেশাদার নিবন্ধন | Freelancer Onboarding | A to Z',
  description: 'Join the A to Z Freelancer Marketplace. Verify your phone, build your profile, and start offering services.',
};

export default function FreelancerOnboardingPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <OnboardingWizard />
    </main>
  );
}

