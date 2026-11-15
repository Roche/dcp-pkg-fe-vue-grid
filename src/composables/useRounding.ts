/**
 * Rounds a number or array of numbers to a specified number of digits.
 * Optionally adds trailing zeros.
 * 
 * @param {number|number[]} x - The number or array to round.
 * @param {number} digits - Number of decimal places.
 * @param {boolean} trailing - Whether to add trailing zeros.
 * @returns {number|string|Array} - Rounded value(s).
 */
export function useRounding(): { round: (x: number | number[], digits?: number, trailing?: boolean) => number | string | Array<number | string> } {
    function round(
        x: number | number[],
        digits: number = 0,
        trailing: boolean = false
    ): number | string | Array<number | string> {
        if (Array.isArray(x)) {
            const mapped = x.map((item) => round(item, digits, trailing));
            return mapped.flat ? mapped.flat() : ([] as Array<number | string>).concat(...mapped);
        } else {
            if (
                digits === Infinity ||
                Number.isInteger(x) ||
                Number.isNaN(digits)
            ) {
                return x
            } else {
                const posneg = Math.sign(x)
                let z = Math.abs(x) * Math.pow(10, digits)
                z = z + 0.5
                z = Math.trunc(z)
                z = z / Math.pow(10, digits)
                let result: number | string = z * posneg

                if (trailing) {
                    // toFixed returns a string with trailing zeros
                    result = result.toFixed(digits)
                }
                return result
            }
        }
    }

    return { round }
}