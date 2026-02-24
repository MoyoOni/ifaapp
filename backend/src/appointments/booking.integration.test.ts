it('should create escrow and release on completion', async () => {
  const booking = await createBooking();
  expect(booking.escrowId).toBeDefined();

  await completeConsultation(booking.id);
  const escrow = await findEscrow(booking.escrowId);
  expect(escrow.status).toBe('released');
});