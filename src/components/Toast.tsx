import React, { useEffect } from "react";

const Toast = (props: {
  message: string;
  title: string;
  visible: boolean;
  close: (e: Event) => void;
}) => {
  useEffect(() => {
    if (props.visible) {
      const timer = setTimeout(() => {
        props.close;
      }, 5000); // Duration of 5 seconds

      return () => clearTimeout(timer);
    }
  }, [props.visible]);

  return (
    <div>
      <div className="toast toast-end z-20 ">
        <div className="alert alert-success backdrop-blur-lg bg-green-500/80">
          <span className="font-semibold">{props.title}</span>{" "}
          <p className="prose">Successfully added to your library.</p>
        </div>
      </div>
    </div>
  );
};

export default Toast;
