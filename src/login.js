import './styles.css';

document.addEventListener('DOMContentLoaded', ()=> {
    console.log('loaded')
    const errorMsg = document.getElementById('errorMsg');
    const loginForm = document.getElementById('loginForm');

    if (window.location.search.includes('error')) {
        errorMsg.style.display ='block';
    };

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        console.log(username +"," +password)
        try {
            const response = await fetch('/login', {
                method : 'POST',
                headers : {
                    'Content-Type' : 'application/x-www-form-urlencoded' 
                },
                body : `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
            });

            if (response.redirected) {
                window.location.href = response.url;
            }
        } catch (error) {
            errorMsg.style.display = 'block';
        }
    }); 
});