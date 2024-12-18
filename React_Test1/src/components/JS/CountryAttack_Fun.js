import { transition } from 'd3';
import $ from 'jquery';

let isHidden = true; // Tracks visibility of container-item
let isAnimating = false; // Prevents repeated animations during a single click

export const setupCountryAttackAnimation = () => {
  $(".btn_hideShow").click(function () {
    if (isAnimating) return; // Prevent additional clicks during animation
    isAnimating = true;

    if (isHidden) {
      // Hide container-item and move Classification down
      $(".leftsize").animate(
        {
          marginLeft: "-320px",
        //   opacity: 1,
        },
        100,
        () => {
          isAnimating = false; // Allow new animation after completion
        }
      );
      $(".btn_hideShow").mouseenter(function () { 
        $(".Arrow3").css({
          display: "inline",
          transform: "rotate(-90deg)",
          opacity: "1",
          color: "#00bcd4"
        })
      });
      $(".btn_hideShow").mouseleave(function () { 
        $(".Arrow3").css({
          display: "none",
          opacity: "0"
        })
      });
    } else {
      // Show container-item and move Classification up
      $(".leftsize").animate(
        {
            marginLeft: "0px",
            // opacity: 1,
        },
        100,
        () => {
          isAnimating = false; // Allow new animation after completion
        }
      );
      $(".btn_hideShow").mouseenter(function () { 
        $(".Arrow3").css({
          display: "inline",
          transform: "rotate(90deg)",
          opacity: "1",
          color: "#00bcd4"
        })
      });
      $(".btn_hideShow").mouseleave(function () { 
        $(".Arrow3").css({
          display: "none",
          opacity: "0"
        })
      });
    }

    isHidden = !isHidden; // Toggle visibility state
  });
  
  
};
