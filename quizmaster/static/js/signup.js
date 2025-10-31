function validateUsername(username, input) {
    if (username?.length >= 3 && username?.match(/^\w+$/)) {
        return true;
    }
    document.getElementById('usernameError')?.classList.add('active');
    if (input) {
        input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    }
    return false;
}

function validateFullname(fullname, input) {
    if (fullname?.length >= 3) {
        return true;
    }
    document.getElementById('nameError')?.classList.add('active');
    if (input) {
        input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    }
    return false;
}

function validatePhone(phone, input) {
    if (!phone || phone?.match(/^[6-9]\d{9}$/)) {
        return true;
    }
    document.getElementById('phoneError')?.classList.add('active');
    if (input) {
        input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    }
    return false;
}

function validatePassword(password, input) {
    if (password?.length >= 8) {
        return true;
    }
    document.getElementById('passwordError')?.classList.add('active');
    if (input) {
        input.style.borderColor = 'rgba(239, 68, 68, 0.5)';
    }
    return false;
}
