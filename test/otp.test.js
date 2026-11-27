import { describe, it, expect } from "bun:test";
import { distributeOtpInput, OTP_LENGTH } from "../src/services/otp.js";

const empty = () => Array(OTP_LENGTH).fill("");

describe("OTP input autofill handling", () => {
  it("distributes a full one-time-code autofill across all six boxes", () => {
    const { values, nextFocus, autofilled } = distributeOtpInput(empty(), 0, "637281");
    expect(values.join("")).toBe("637281");
    expect(nextFocus).toBe(5);
    expect(autofilled).toBe(true);
  });

  it("does not drop all but the last digit of a partial autofill", () => {
    const current = ["1", "", "", "", "", ""];
    const { values, nextFocus } = distributeOtpInput(current, 1, "23");
    expect(values.join("")).toBe("123");
    expect(nextFocus).toBe(3);
  });

  it("keeps single-digit typing behaviour", () => {
    const current = ["", "", "", "", "", ""];
    const { values, nextFocus, autofilled } = distributeOtpInput(current, 2, "9");
    expect(values.join("")).toBe("9");
    expect(nextFocus).toBe(3);
    expect(autofilled).toBe(false);
  });

  it("clears the box when the input is emptied", () => {
    const current = ["1", "2", "3", "4", "5", "6"];
    const { values, nextFocus } = distributeOtpInput(current, 3, "");
    expect(values.join("")).toBe("12356");
    expect(nextFocus).toBe(3);
  });

  it("replaces an existing digit when the input reports old+new characters", () => {
    const current = ["6", "", "", "", "", ""];
    const { values, nextFocus } = distributeOtpInput(current, 0, "69");
    expect(values.join("")).toBe("9");
    expect(nextFocus).toBe(1);
  });

  it("never writes past the last box", () => {
    const current = ["", "", "", "", "", ""];
    const { values, nextFocus } = distributeOtpInput(current, 4, "123456");
    expect(values.join("")).toBe("12");
    expect(nextFocus).toBe(5);
  });
});
