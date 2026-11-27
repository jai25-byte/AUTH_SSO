/** Shared 6-digit OTP input helpers. */

export const OTP_LENGTH = 6;

/**
 * Apply a typed or autofilled value to one OTP box.
 *
 * Browser/email autofill (`autocomplete="one-time-code"`) can deliver all six
 * digits into a single input. Distributing them across the boxes keeps the
 * assembled code identical to what the user received.
 *
 * @param {string[]} current - current box values
 * @param {number} index - box that received the input
 * @param {string} rawValue - value from the input event
 * @returns {{values: string[], nextFocus: number, autofilled: boolean}}
 */
export function distributeOtpInput(current, index, rawValue) {
  const values = Array.isArray(current) ? [...current] : Array(OTP_LENGTH).fill("");
  while (values.length < OTP_LENGTH) values.push("");

  const digits = String(rawValue ?? "").replace(/\D/g, "");
  if (!digits) {
    values[index] = "";
    return { values, nextFocus: index, autofilled: false };
  }

  // A box that already holds a digit can report "old+new" when the user types
  // into it. Treat that as a replacement, not as two new digits.
  if (digits.length === 2 && values[index] && digits.startsWith(values[index])) {
    values[index] = digits[1];
    return {
      values,
      nextFocus: index < OTP_LENGTH - 1 ? index + 1 : index,
      autofilled: false,
    };
  }

  let last = index;
  for (let offset = 0; offset < digits.length && index + offset < OTP_LENGTH; offset += 1) {
    values[index + offset] = digits[offset];
    last = index + offset;
  }

  return {
    values,
    nextFocus: last < OTP_LENGTH - 1 ? last + 1 : last,
    autofilled: digits.length > 1,
  };
}
