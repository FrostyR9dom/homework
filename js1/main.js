let myUser = {
    name: "Константин",
    age: 35,
    greet: function(otherName) {
        return 'Hello "' + otherName + '"';
    }
};

let users = [
    { name: "Дмитрий", age: 30, isAdmin: false },
    { name: "Ира", age: 25, isAdmin: true },
    { name: "Полина", age: 40, isAdmin: false },
    { name: "Алиса", age: 22, isAdmin: false }
];

let simpleUsersCount = 0;
for (let i = 0; i < users.length; i++) {
    if (!users[i].isAdmin) {
        simpleUsersCount = simpleUsersCount + 1;
    }
}

console.log("Количество простых пользователей:", simpleUsersCount);

console.log(myUser.greet("Константин"));
