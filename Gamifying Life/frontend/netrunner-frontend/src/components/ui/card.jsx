import React from "react";

// very small, framework-agnostic stubs that match common usage
export function Card({ className = "", ...props }) {
  return <div className={className} {...props} />;
}
export function CardHeader({ className = "", ...props }) {
  return <div className={className} {...props} />;
}
export function CardTitle({ className = "", ...props }) {
  return <h3 className={className} {...props} />;
}
export function CardDescription({ className = "", ...props }) {
  return <p className={className} {...props} />;
}
export function CardContent({ className = "", ...props }) {
  return <div className={className} {...props} />;
}
export function CardFooter({ className = "", ...props }) {
  return <div className={className} {...props} />;
}

// allow default import if you used it somewhere
export default Card;
