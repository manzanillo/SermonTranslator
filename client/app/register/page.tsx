import RegisterForm from '../components/auth/RegisterForm'
import { AuthPageShell } from '../components/auth/AuthPageShell'

export default function RegisterPage() {
  return (
    <AuthPageShell
      title="Create a Zermon account"
      subtitle="Register as an imam or listener to manage sermon sessions, translations, and audience participation."
      footnote="The account type helps us connect you with the right dashboard experience."
    >
      <RegisterForm />
    </AuthPageShell>
  )
}
