let password = document.querySelector("#password");
let strengthContainer = document.querySelector(".strength-container");
let strengthBar = document.querySelector("#strength-bar");
let strengthText = document.querySelector(".strength-text");

password.addEventListener("focus", function(){
    strengthContainer.style.display = "block";
});

password.addEventListener("blur", function(){
    strengthContainer.style.display = "none";
});

function setStrength(value){
    strengthBar.style.width = value + "%";
}

function setColorAndText(color, text){
    strengthBar.style.backgroundColor = color;
    strengthText.innerHTML = text;
    strengthText.style.color = color;
}

function clearStrength(){
    strengthBar.style.width = 0;
    strengthBar.style.backgroundColor = "";
    strengthText.innerHTML = "";
}

password.addEventListener("keyup", checkPasswordStrength);

function checkPasswordStrength(){
    let strength = 0;

    if(password.value == ""){
        clearStrength();
        return false;
    }

    if(password.value.match(/\s/)){
        setColorAndText("red", "White space is not allowed");
        return false;
    }

    if(password.value.match(/<|>/)){
        setColorAndText("red", "< > characters are not allowed");
        return false;
    }

    if(password.value.length > 12){
        setColorAndText("red", "Password greater\nthan 12 char.");
        return false;
    }

    if(password.value.length < 7){
        strength = 20;
        setColorAndText("red", "Too short"); // short
    }else{
        let lowerCase = password.value.match(/[a-z]/);
        let upperCase = password.value.match(/[A-Z]/);
        let numbers = password.value.match(/[0-9]/);
        let specialCharacters = password.value.match(/[\!\~\@\&\#\$\%\^\&\*\(\)\{\}\?\-\_\+\=]/);

        if(lowerCase || upperCase || numbers || specialCharacters){
            strength = 40;
            setColorAndText("red", "Weak");
        }

        if(
            (lowerCase && upperCase) || (lowerCase && numbers) || (lowerCase && specialCharacters) ||
            (upperCase && numbers) || (upperCase && specialCharacters) || (numbers && specialCharacters)
        )
        {
            strength = 60;
            setColorAndText("orange", "Medium");
        }

        if( (lowerCase && upperCase && numbers) || (lowerCase && upperCase && specialCharacters) ||
            (lowerCase && numbers && specialCharacters) ||  (upperCase && numbers && specialCharacters)
        )
        {
            strength = 80;
            setColorAndText("#088f08", "Strong");
        }

        if(lowerCase && upperCase && numbers && specialCharacters){
            strength = 100;
            setColorAndText("green", "Very Strong");
        }
    }
    setStrength(strength);
}
