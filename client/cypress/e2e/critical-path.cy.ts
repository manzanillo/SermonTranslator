describe('Critical path', () => {
  const appUrl = 'http://localhost:5173'
  const user = {
    name: 'Test Imam',
    email: `test.imam.${Date.now()}@example.com`,
    password: 'Test1234!',
  }

  it('registers a new imam, logs in, and reaches the imam dashboard', () => {
    cy.visit(appUrl)

    cy.contains('Create account').click()

    cy.url().should('include', '/register')
    cy.get('#name').type(user.name)
    cy.get('#email').type(user.email)
    cy.get('#password').type(user.password)
    cy.get('#role').select('imam')

    cy.contains('Create account').click()

    cy.url().should('include', '/login')
    cy.contains('Welcome back to Zermon').should('be.visible')

    cy.get('#email').type(user.email)
    cy.get('#password').type(user.password)
    cy.contains('Sign in').click()

    cy.url({ timeout: 10000 }).should('include', '/imam')
    cy.contains('Manage your sermon sessions and translations in real time.').should('be.visible')
    cy.get('#start-new-session-btn').should('exist')
  })
})