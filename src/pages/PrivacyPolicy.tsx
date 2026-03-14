import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";

const PrivacyPolicy = () => {
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

        <h1 className="text-2xl font-bold text-foreground mb-1">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-6">Last updated: {lastUpdated}</p>

        <div className="prose prose-sm max-w-none text-foreground space-y-4">
          <section>
            <h2 className="text-lg font-semibold">1. Introduction</h2>
            <p className="text-sm text-muted-foreground">
              CollegeTime ("we", "our", or "us") is a timetable management application that helps students organize their college schedules. This Privacy Policy explains how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Information We Collect</h2>
            <p className="text-sm text-muted-foreground">We collect the following types of information:</p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Account Information:</strong> Email address when you create an account for cloud sync.</li>
              <li><strong>Timetable Data:</strong> Lecture names, days, and times you enter into the app.</li>
              <li><strong>Attendance Data:</strong> Subject attendance percentages you track.</li>
              <li><strong>Usage Analytics:</strong> Pages visited and features used (anonymized).</li>
              <li><strong>Device Information:</strong> Browser type, operating system, for app performance optimization.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li>To provide and maintain the timetable management service.</li>
              <li>To sync your data across devices when you create an account.</li>
              <li>To send lecture reminders and notifications you opt into.</li>
              <li>To improve app performance and user experience.</li>
              <li>To display relevant announcements and promotions within the app.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Data Storage & Security</h2>
            <p className="text-sm text-muted-foreground">
              Your data is stored securely using industry-standard encryption. If you use the app without an account, data is stored locally on your device only. When signed in, data is synced to our secure cloud servers. We do not sell or share your personal data with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Third-Party Services</h2>
            <p className="text-sm text-muted-foreground">
              We use the following third-party services:
            </p>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Cloud Infrastructure:</strong> For data storage and authentication.</li>
              <li><strong>AI Services:</strong> For timetable image parsing (processed server-side, not stored).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">6. Permissions</h2>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              <li><strong>Notifications:</strong> To send lecture reminders. You can disable this at any time.</li>
              <li><strong>Camera/Gallery:</strong> Only when you choose to upload a timetable image. Images are processed and not stored.</li>
              <li><strong>Internet:</strong> Required for cloud sync and account features.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">7. Data Retention & Deletion</h2>
            <p className="text-sm text-muted-foreground">
              You can delete your account and all associated data at any time by signing out and contacting us. Local data can be cleared by resetting the timetable or clearing app data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">8. Children's Privacy</h2>
            <p className="text-sm text-muted-foreground">
              Our app is intended for college students (typically 16+). We do not knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">9. Changes to This Policy</h2>
            <p className="text-sm text-muted-foreground">
              We may update this Privacy Policy from time to time. Changes will be posted within the app with an updated date.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">10. Contact Us</h2>
            <p className="text-sm text-muted-foreground">
              If you have questions about this Privacy Policy, please contact us at: support@mycollegetime.app
            </p>
          </section>
        </div>
      </div>
    </ThemeProvider>
  );
};

export default PrivacyPolicy;
