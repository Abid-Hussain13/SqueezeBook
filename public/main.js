$(document).ready(function(){
  $("#userPic").on("click", function(e){
    e.stopPropagation();
    $(".logout").toggle();
  })

  $(document).on("click", function(){
    $(".logout").hide();
  })
})

$(".logout").on("click", function (e) {
    e.stopPropagation();
  });

  window.addEventListener("beforeunload", function () {
    sessionStorage.setItem("scrollPosition", window.scrollY);
  });

  window.addEventListener("load", function () {
    const scrollPos = sessionStorage.getItem("scrollPosition");
    if (scrollPos !== null) {
      window.scrollTo(0, parseInt(scrollPos));
      sessionStorage.removeItem("scrollPosition"); 
    }
  });



const header = $0.parentElement.querySelector('header');
const h1 = header ? header.querySelector('h1') : null;
const paragraphs = Array.from($0.parentElement.querySelectorAll('p'));
const links = Array.from($0.parentElement.querySelectorAll('a'));
const hr = $0;
const strongElements = Array.from($0.parentElement.querySelectorAll('strong'));

const data = {};

if (header) {
  data['header'] = Object.fromEntries(
    Object.entries(window.getComputedStyle(header)).filter(([key, value]) => !isNaN(key))
  );
}
if (h1) {
  data['h1'] = Object.fromEntries(
    Object.entries(window.getComputedStyle(h1)).filter(([key, value]) => !isNaN(key))
  );
}
data['paragraphs'] = paragraphs.map(p => Object.fromEntries(
  Object.entries(window.getComputedStyle(p)).filter(([key, value]) => !isNaN(key))
));
data['links'] = links.map(a => Object.fromEntries(
  Object.entries(window.getComputedStyle(a)).filter(([key, value]) => !isNaN(key))
));
data['hr'] = Object.fromEntries(
  Object.entries(window.getComputedStyle(hr)).filter(([key, value]) => !isNaN(key))
);
data['strongElements'] = strongElements.map(strong => Object.fromEntries(
  Object.entries(window.getComputedStyle(strong)).filter(([key, value]) => !isNaN(key))
));