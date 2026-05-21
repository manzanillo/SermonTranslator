describe('Login form error handling', () => {
  const appUrl = 'http://localhost:5173'

  beforeEach(() => {
    cy.visit(`${appUrl}/login`)
  })

  it('displays "Invalid email or password" error when logging in with incorrect password', () => {
    // Use a non-existent email and password combination
    const incorrectEmail = 'nonexistent@example.com'
    const incorrectPassword = 'WrongPassword123!'

    // Fill in the email
    cy.get('#email').type(incorrectEmail)

    // Fill in the password
    cy.get('#password').type(incorrectPassword)

    // Submit the form
    cy.contains('button', 'Sign in').click()

    // Verify the error message appears
    cy.get('[data-cy="error-message"]').should('be.visible')
    cy.get('[data-cy="error-message"]').should('contain', 'Invalid email or password')
  })
})
