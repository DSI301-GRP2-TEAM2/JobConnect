import sys
sys.path.insert(0, 'src')
from calculator import add, subtract, multiply, divide, power, is_positive, absolute_value

def test_add():
    assert add(2, 3) == 5
    assert add(-1, 1) == 0

def test_subtract():
    assert subtract(5, 3) == 2
    assert subtract(0, 0) == 0

def test_multiply():
    assert multiply(3, 4) == 12
    assert multiply(0, 5) == 0

def test_divide():
    assert divide(10, 2) == 5.0
    try:
        divide(1, 0)
        assert False, 'Should have raised'
    except ValueError:
        pass

def test_power():
    assert power(2, 3) == 8
    assert power(5, 0) == 1

def test_is_positive():
    assert is_positive(5) is True
    assert is_positive(-3) is False
    assert is_positive(0) is False

def test_absolute_value():
    assert absolute_value(-5) == 5
    assert absolute_value(3) == 3
    assert absolute_value(0) == 0
