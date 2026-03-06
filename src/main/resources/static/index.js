let xp = 0;
let health = 100;
let gold = 150;
let currentWeapon = 0;
let inventory = ["stick"];
let fighting;
let monsterHealth;

const button1 = document.querySelector("#button1");
const button2 = document.querySelector("#button2");
const button3 = document.querySelector("#button3");
const text = document.querySelector("#text");
const xpText = document.querySelector("#xpText");
const healthText = document.querySelector("#healthText");
const goldText = document.querySelector("#goldText");
const monsterStats = document.querySelector("#monsterStats");
const monsterNameText = document.querySelector("#monsterName");
const monsterHealthText = document.querySelector("#monsterHealth");

const monsters = [
    {
        name: "slime",
        level: 2,
        health: 15
    },
    {
        name: "skeleton",
        level: 8,
        health: 60
    },
    {
        name: "dragon",
        level: 20,
        health: 300
    },

]

const weapons = [
    {
        name: "stick",
        damage: 5
    },
    {
        name: "dagger",
        damage: 10
    },
    {
        name: "hammer",
        damage: 30
    },
    {
        name: "sword",
        damage: 100
    }
]

const locations = [
    {
        name: "townSquare",
        "buttonText": ["Go to store", "Go to cave", "Fight Dragon"],
        "buttonFunctions": [goStore, goCave, fightDragon],
        text: "You are in the town square."
    },
    {
        name: "store",
        "buttonText": ["Buy 10 health 10 gold", "Buy weapon 30 gold", "Go to town square"],
        "buttonFunctions": [buyHealth, buyWeapon, goTown],
        text: "You enter the store."
    },
    {
        name: "cave",
        "buttonText": ["Fight Slime", "Fight skeleton", "Go to town square"],
        "buttonFunctions": [fightSlime, fightSkeleton, goTown],
        text: "You enter the cave. There are monsters."
    },
    {
        name: "fight",
        "buttonText": ["Light Attack", "Heavy Attack", "Run"],
        "buttonFunctions": [lightAttack, heavyAttack, goTown],
        text: "You are fighting a moster."
    },
    {
        name: "defeatMonster",
        "buttonText": ["Go to town square", "Go to town square", "Go to town square"],
        "buttonFunctions": [goTown, goTown, goTown],
        text: ""
    },
    {
        name: "lose",
        "buttonText": ["Restart", "Restart", "Restart"],
        "buttonFunctions": [restart, restart, restart],
        text: "Expedition Failed."
    }
]

button1.onclick = goStore;
button2.onclick = goCave;
button3.onclick = fightDragon;

function update(location) {
    monsterStats.style.display = "none";
    button1.innerText = location["buttonText"][0];
    button2.innerText = location["buttonText"][1];
    button3.innerText = location["buttonText"][2];
    button1.onclick = location["buttonFunctions"][0];
    button2.onclick = location["buttonFunctions"][1];
    button3.onclick = location["buttonFunctions"][2];
    if (location.name != "defeatMonster")
        text.innerText = location.text;
}

function goTown() {
    update(locations[0]);
}

function goStore() {
    update(locations[1]);
}

function goCave() {
    update(locations[2]);
}

function buyHealth() {
    if (gold >= 10) {
        gold -= 10;
        health += 10;
        goldText.innerText = gold;
        healthText.innerText = health;
    } else {
        text.innerText += "You broke."
    }
}

function buyWeapon() {
    if (gold >= 30 && currentWeapon < weapons.length - 1) {
        gold -= 30;
        goldText.innerText = gold;
        currentWeapon++;
        let newWeapon = weapons[currentWeapon]
        text.innerText += "\nYou got a new " + newWeapon.name + ". It has " + newWeapon.damage + " damage.";
        inventory.push(newWeapon.name);
    } else if (currentWeapon < weapons.length - 1) {
        text.innerText += "\nYou bought every weapon."
        button2.innerText = "Sell old weapon for 15 gold.";
        button2.onclick = sellWeapon;
    } else {
        text.innerText += "You broke."
    }
}

function sellWeapon() {
    if (inventory.length > 1) {
        gold += 15;
        goldText.innerText = gold;
        let soldWeapon = inventory.shift();
        text.innerText += "\nYou sold " + soldWeapon + ".";
    } else {
        text.innerText += "This is your only weapon man."
    }
}

function fightSlime() {
    fighting = 0;
    goFight();
}

function fightSkeleton() {
    fighting = 1;
    goFight();
}

function fightDragon() {
    fighting = 2;
    goFight();
}

function goFight() {
    //console.log("goFight fighting: " + fighting)
    update(locations[3]);
    monsterHealth = monsters[fighting].health;
    monsterStats.style.display = "block";
    monsterNameText.innerText = monsters[fighting].name;
    monsterHealthText.innerText = monsterHealth;
}

function lightAttack() {
    text.innerText = "Monster " + monsters[fighting].name + " attack you.\n"
    text.innerText += "You perform a light attack with " + weapons[currentWeapon].name + ".";
    health -= monsters[fighting].level;
    monsterHealth -= weapons[currentWeapon].damage;
    healthText.innerText = health;
    monsterHealthText.innerText = monsterHealth;

    if (health <= 0) {
        lose();
    } else if (monsterHealth <= 0) {
        defeatMonster();
    }
}

function heavyAttack() {
    text.innerText = "Monster " + monsters[fighting].name + " attack you.\n"
    text.innerText += "You perform a heavy attack with " + weapons[currentWeapon].name + ".";
    health -= monsters[fighting].level * 2;
    let isCrit = Math.ceil(Math.random() * 100) < xp * 2;
    if (isCrit) text.innerText += "Critical Hit!";
    monsterHealth -= isCrit ? weapons[currentWeapon].damage * 2 : weapons[currentWeapon].damage * 2;
    healthText.innerText = health;
    monsterHealthText.innerText = monsterHealth;

    if (health <= 0) {
        lose();
    } else if (monsterHealth <= 0) {
        defeatMonster();
    }
}

function defeatMonster() {
    goldEarned = Math.ceil(Math.random() * 10 * monsters[fighting].level)
    text.innerText = "You defeated the " + monsters[fighting].name + ".\n";
    text.innerText += "You earned " + goldEarned + " gold.\n";
    gold += goldEarned;
    goldText.innerText = gold;

    xpEarned = monsters[fighting].level;
    text.innerText += "You earned " + xpEarned + " xp.";
    xp += xpEarned;
    xpText.innerText = xp;
    update(locations[4]);
}

function lose() {
    update(locations[5])
}

function restart() {
    xp = 0;
    health = 100;
    gold = 50;
    currentWeapon = 0;
    inventory = ["stick"];
    xpText.innerText = xp;
    healthText.innerText = health;
    goldText.innerText = gold;
    goTown()
}

/* Kitap Listeleme */

document.addEventListener("DOMContentLoaded", function () {
    kitaplariGetir();
});

function kitaplariGetir() {
    fetch('http://localhost:8080/api/books')
        .then(response => response.json()) // Gelen cevabı JSON formatına çeviriyoruz
        .then(data => {
            const tablo = document.getElementById('kitap-tablosu');
            tablo.innerHTML = ''; // Tabloyu temizle

            // Her bir kitap verisi için yeni bir satır oluşturuyoruz
            data.forEach(book => {
                const satir = `
                    <tr>
                        <td>${book.id}</td>
                        <td>${book.title}</td>
                        <td>${book.author}</td>
                        <td>${book.stockCount}</td>
                    </tr>
                `;
                tablo.innerHTML += satir; // Satırı tabloya ekle
            });
        })
        .catch(error => console.error('Hata oluştu:', error));
}