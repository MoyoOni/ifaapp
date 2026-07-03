describe('Booking Flow', () => {
  it('should allow client to book an appointment', () => {
    cy.visit('/login');
    cy.get('#email').type('client@example.com');
    cy.get('#password').type('pass');
    cy.get('button[type="submit"]').click();

    cy.contains('Book Appointment').click();
    cy.get('.select-babalawo').select('Babaláwo A');
    cy.get('.confirm-booking').click();

    cy.url().should('include', '/appointments');
  });
});