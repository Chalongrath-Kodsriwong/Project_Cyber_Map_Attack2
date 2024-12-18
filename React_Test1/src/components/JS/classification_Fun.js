import $ from 'jquery';

let isHidden = true; // Tracks visibility of container-item
let isAnimating = false; // Prevents repeated animations during a single click

function getResponsiveMarginTopOFClassification() {
  if (window.innerWidth >= 1920) {
    return "280px"; // สำหรับหน้าจอ 1920px
  } else if (window.innerWidth >= 1440) {
    return "250px"; // สำหรับหน้าจอ 1440px
  } else {
    return "230px"; // ค่ามาตรฐานสำหรับหน้าจออื่นๆ
  }
}

export const setupClassificationAnimation = () => {
  $(".Classification").click(function (e) {
    // ตรวจสอบว่าคลิกที่ปุ่ม .btnOfSwitch หรือไม่
    if ($(e.target).hasClass("btnOfSwitch")) {
      return; // ไม่ทำงาน animation ถ้าคลิกที่ปุ่ม
    }

    if (isAnimating) return; // Prevent additional clicks during animation
    isAnimating = true;

    const marginTopValue = getResponsiveMarginTopOFClassification();

    if (isHidden) {
      // Hide container-item and move Classification down
      $(".container-item").animate(
        {
          marginBottom: "-100px",
          opacity: 0,
        },
        100,
        () => {
          isAnimating = false;
        }
      );
      $(".Classification").animate(
        {
          marginTop: marginTopValue,
        },
        100
      );
      $(".Arrow1").css({
        transform: "rotate(-180deg)",
      });
    } else {
      // Show container-item and move Classification up
      $(".container-item").animate(
        {
          marginBottom: "0px",
          opacity: 1,
        },
        10,
        () => {
          isAnimating = false;
        }
      );
      $(".Classification").animate(
        {
          marginTop: "0px",
        },
        100
      );
      $(".Arrow1").css({
        transform: "rotate(0deg)",
      });
    }

    isHidden = !isHidden; // Toggle visibility state
  });

  $(".Classification").mouseenter(function () {
    $(".Arrow1").css({ color: "#00bcd4" });
  });

  $(".Classification").mouseleave(function () {
    $(".Arrow1").css({ color: "" });
  });
};
