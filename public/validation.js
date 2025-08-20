$(document).ready(function () {
  $('.tab a').on('click', function (e) {
    e.preventDefault();

    $(this).parent().addClass('active');
    $(this).parent().siblings().removeClass('active');

    const target = $(this).attr('href');

    $('.tab-content > div').hide();
    $(target).fadeIn(600);
  });

  const hash = window.location.hash;
  if (hash === '#login') {
    $('.tab a[href="#login"]').click();
  }
});



$(document).ready(function(){
  $(".signup-form").on("submit",function(e){
    e.preventDefault();

    $(".error").text("");

    let isValid = true;
    let fName = $("#fName").val().trim();
     let lName = $("#lName").val().trim();
    let email = $("#email").val().trim();
    let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
    let password = $("#password").val().trim();

    
    if(fName === ""){
      $("#fName").next(".error").text("Please Enter First Name");
      isValid = false;
    }
    else if(lName === ""){
      $("#lName").next(".error").text("Please Enter Last Name");
      isValid = false;
    }
    else if(email === ""){
      $("#email").next(".error").text("Please Enter Email");
      isValid = false;
    }else if(!emailPattern.test(email)){
      $("#email").next(".error").text("Please Enter Valid Email");
      isValid = false;
    }
    else if(password === ""){
      $("#password").next(".error").text("Please Enter Password");
      isValid = false;
    }else if(password.length < 8){
      $("#password").next(".error").text("Password must be at least 8 charaters");
      isValid = false;
    }
    if(isValid){
      this.submit();
    }
  })
});

$(document).ready(function(){
  $(".login-form").on("submit", function(e) {
    e.preventDefault(); // Prevent default for validation
    $(".error").text(""); // Clear previous errors

    let isValid = true;
    let loginemail = $("#loginemail").val().trim();
    let loginpassword = $("#loginpassword").val().trim();
    let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;

    if (loginemail === "") {
      $("#loginemail").next(".error").text("Please Enter Email");
      isValid = false;
    } else if (!emailPattern.test(loginemail)) {
      $("#loginemail").next(".error").text("Please Enter Valid Email");
      isValid = false;
    }
    if (loginpassword === "") {
      $("#loginpassword").next(".error").text("Please Enter Password");
      isValid = false;
    }

    if (isValid) {
      // Submit the form normally to let the browser handle the redirect
      this.submit();
    }
  });
});


// Book Submittion Validation 

$(document).ready(function(){
  $(".book-form").on("submit",function(e){
    e.preventDefault();

    $(".error").text("");

    let isValid = true;
    let isbn = $("#isbn").val().trim();
    let rating = $("#rating").val().trim();
    let status = $("#status").val().trim();

    if(isbn === ""){
      $("#isbn").next(".error").text("Please Enter ISBN");
      isValid = false;
    }else if(isbn.length < 10 || isbn.length > 13 || isbn.length == 11 || isbn.length == 12){
      $("#isbn").next(".error").text("Please Enter Valid ISBN");
      isValid = false;
    }
    else if(rating === ""){
      $("#rating").next(".error").text("Please Enter Rating");
      isValid = false;
    }else if(rating > 10 || rating <=0 ){
      $("#rating").next(".error").text("Please Enter Valid Rating");
      isValid = false;
    }
    else if(status === "Select"){
      $("#status").next(".error").text("Please Enter Status");
      isValid = false;
    }
    if(isValid){
      this.submit();
    }
  })
})
