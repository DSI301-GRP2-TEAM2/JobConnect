export function add(a, b) {
    return a + b;
}

export function subtract(a, b) {
    return a - b;
}

export function multiply(a, b) {
    return a * b;
}

export function divide(a, b) {
    if (b === 0) {
        throw new Error('Cannot divide by zero');
    }
    return a / b;
}

export function power(a, b) {
    return Math.pow(a, b);
}

export function isPositive(n) {
    return n > 0;
}

export function absoluteValue(n) {
    return n >= 0 ? n : -n;
}

export function square(n) {
    return power(n, 2);
}

export function cube(n) {
    return power(n, 3);
}

export function factorial(n) {
    if (n < 0) {
        throw new Error('Cannot compute factorial of negative number');
    }
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
