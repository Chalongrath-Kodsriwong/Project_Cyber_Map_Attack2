import { transition } from 'd3';
import $ from 'jquery';

let isHidden = true; // Tracks visibility of container-item
let isAnimating = false; // Prevents repeated animations during a single click

const Arrow = document.querySelector(".arrow");
const btnShowHide = document.querySelector(".btn-showhide");
let status = true;

export const setupCountAttackAnimation = () => {
  $(".btn-showhide").click(function () {
    if (isAnimating) return; // Prevent additional clicks during animation
    isAnimating = true;

    if (isHidden) {
      // Hide container-item and move Classification down
      $(".toleftsize").animate(
        {
          marginLeft: "-250px",
        //   opacity: 1,
        },
        100,
        () => {
          isAnimating = false; // Allow new animation after completion
        }
      );
    } else {
      // Show container-item and move Classification up
      $(".toleftsize").animate(
        {
            marginLeft: "0px",
            // opacity: 1,
        },
        100,
        () => {
          isAnimating = false; // Allow new animation after completion
        }
      );
    }

    isHidden = !isHidden; // Toggle visibility state
  });
  
};
