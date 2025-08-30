describe('Simple Test Suite', () => {
  it('should pass basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('success');
    expect(result).toBe('success');
  });

  it('should work with test utilities', () => {
    const mockFunction = jest.fn();
    mockFunction('test');
    expect(mockFunction).toHaveBeenCalledWith('test');
  });
});
