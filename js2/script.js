function greet(name) {
    return 'Hello "' + name + '"';
}

console.log(greet("Константин"));

var numbers = [5, 12, 8, 20, 3, 15];

function printNumbersGreaterThan10(arr) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] > 10) {
            console.log(arr[i]);
        }
    }
}

printNumbersGreaterThan10(numbers);

function calculator(num1, num2, operation) {
    if (operation === 'plus') {
        return num1 + num2;
    } else if (operation === 'minus') {
        return num1 - num2;
    } else if (operation === 'multiply') {
        return num1 * num2;
    } else if (operation === 'divide') {
        if (num2 === 0) {
            return 'Ошибка: деление на ноль запрещено';
        }
        return num1 / num2;
    } else {
        return 'Непонятная операция';
    }
}

var result = calculator(2, 3, 'minus');
console.log(result); // -1

var result2 = calculator(4, 5, 'plus');
console.log(result2); // 9

var result3 = calculator(6, 7, 'multiply');
console.log(result3); // 42

var result4 = calculator(10, 2, 'divide');
console.log(result4); // 5
