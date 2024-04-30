import React from "react";
import Link from "next/link";
import { FaDiscord, FaTwitter, FaGithub, FaTwitch } from "react-icons/fa";

function Navigation() {
  return (
    <div className="navigation" style={{ marginBottom: "10px" }}>
      <nav className="navbar navbar-expand navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" href="/">
            DaoPlays
          </Link>
          <div>
            <ul className="navbar-nav ml-auto">
              <li className="nav-item">
                <a className="nav-link" href="http://www.twitter.com/dao_plays">
                  <FaTwitter />
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="http://www.discord.gg/4KbYFt3cSg">
                  <FaDiscord />
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="http://www.twitch.tv/daoplays_">
                  <FaTwitch />
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="http://www.github.com/daoplays">
                  <FaGithub />
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </div>
  );
}

export default Navigation;
