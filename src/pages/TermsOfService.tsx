import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";

const TermsOfService = () => {
  const navigate = useNavigate();
  const lastUpdated = "March 14, 2026";

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="max-w-2xl mx-auto px-4 py-6 bg-background min-h-screen">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-primary font-medium mb-6"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-1">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-6">Last updated: {lastUpdated}</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-4">
          <section>
            <h2 className="text-lg font-semibold">1. Acceptance of Terms</h2>
            <p className="text-sm text-muted-foreground">
              By downloading, installing, or using CollegeTime ("the App"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Description of Service</h2>
            <p className="text-sm text-muted-foreground">
              CollegeTime is a free timetable management tool for college students. It allows you to create, manage, and track your weekly lecture schedules, attendance, and receive reminders.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. User Accounts</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>You may use the App without creating an account (local-only mode).</li>
              <li>Creating an account enables cloud sync across devices.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You must provide accurate information when creating an account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Acceptable Use</h2>
            <p className="text-sm text-muted-foreground">You agree not to:</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>Use the App for any unlawful purpose.</li>
              <li>Attempt to gain unauthorized access to our systems.</li>
              <li>Submit false, misleading, or inappropriate content through promotions.</li>
              <li>Interfere with other users' use of the App.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Intellectual Property</h2>
            <p className="text-sm text-muted-foreground">
              All content, design, and code in CollegeTime is owned by us or our licensors. You may not copy, modify, or distribute any part of the App without permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Promotions & Advertisements</h2>
            <p className="text-sm text-muted-foreground">
              The App may display advertisements and promotional content. Users who submit promotions must ensure their content does not violate any laws or third-party rights.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Disclaimer of Warranties</h2>
            <p className="text-sm text-muted-foreground">
              The App is provided "as is" without warranties of any kind. We do not guarantee uninterrupted or error-free service. Your timetable data accuracy is your responsibility.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Limitation of Liability</h2>
            <p className="text-sm text-muted-foreground">
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the App, including missed lectures or incorrect schedule data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Termination</h2>
            <p className="text-sm text-muted-foreground">
              We may suspend or terminate your access if you violate these terms. You may stop using the App at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Changes to Terms</h2>
            <p className="text-sm text-muted-foreground">
              We may update these Terms from time to time. Continued use of the App constitutes acceptance of updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">11. Contact</h2>
            <p className="text-sm text-muted-foreground">
              For questions about these Terms, contact us at: support@mycollegetime.app
            </p>
          </section>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default TermsOfService;
