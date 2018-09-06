export class Statistics {
  /**
   * Returns the average of two numbers.
   * This incomplete HTML tag should be reported as an error: <tag
   *
   * @remarks
   * Here's an inline tag {@customInline with some data}.
   *
   * @customBlock
   * Here's an example of a custom block tag.
   *
   * @param x - The first input number
   * @param y - The second input number
   * @returns The arithmetic mean of `x` and `y`
   *
   * @beta @customModifier
   */
  public static getAverage(x: number, y: number): number {
    return (x + y) / 2.0;
  }
}
