def add(a, b):
    """Add two numbers."""
    return a + b

def subtract(a, b):
    """Subtract two numbers."""
    return a - b

def multiply(a, b):
    """Multiply two numbers."""
    return a * b

def divide(a, b):
    """Divide two numbers."""
    if b == 0:
        raise ValueError('Cannot divide by zero')
    return a / b

def power(a, b):
    """Raise a to the power of b."""
    return a ** b

def is_positive(n):
    """Check if a number is positive."""
    return n > 0

def absolute_value(n):
    """Return the absolute value of n."""
    return n if n >= 0 else -n

# Helper for common operations
def square(n):
    """Return the square of n."""
    return power(n, 2)
