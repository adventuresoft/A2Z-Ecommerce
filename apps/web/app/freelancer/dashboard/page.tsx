import { FreelancerDashboard } from '../../../components/Freelancer/FreelancerDashboard.js';

export const metadata = {
  title: 'পেশাদার ড্যাশবোর্ড | Freelancer Dashboard | A to Z',
  description: 'Manage your professional services, coverage locations, availability, and profile revisions.',
};

export default function FreelancerDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <FreelancerDashboard />
    </main>
  );
}

