import React from 'react';

const UnderlinedLink = ({ link, text }) => {
  return (
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      style={{textDecoration: "underline"}}>
      {text}
    </a>
  );
};

export default UnderlinedLink;