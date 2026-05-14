import LoginForm from '../components/auth/LoginForm'
import { AuthPageShell } from '../components/auth/AuthPageShell'

export default function LoginPage() {
  return (
    <AuthPageShell
      title="Welcome back to Zermon"
      subtitle="Sign in to continue managing sermons, listener sessions, and translations in real time."
      footnote="If you need help, contact your administrator for account access."
    >
      <LoginForm />
    </AuthPageShell>
  )
}
