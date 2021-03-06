import React from 'react'

const Navbar = ({ userName = 'Guest', isLoggedIn, avatar, menuActive }) => (
  <nav className="navbar is-fixed-top is-transparent" role="navigation" aria-label="main navigation">
    <div className="container is-widescreen">
      <div className="navbar-brand mr-3">
        <a className="navbar-item" href="/">
          <h1 className="title is-4 is-size-3-tablet has-text-primary is-family-secondary mr-2">Quiz Game</h1>
        </a>

        <a role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-nav="navBarTop">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div id="navBarTop" className="navbar-menu">
        <div className="navbar-start">
          <div className="navbar-item mx-3">
            <a href="/auth" className="button is-success is-rounded is-outlined has-text-black">
              Play
            </a>
          </div>
          <a href="/results" className={menuActive === 'results' ? 'navbar-item mx-3 is-active' : 'navbar-item mx-3'}>
            Results
              </a>
          <a href="/about" className="navbar-item mx-3">
            About
              </a>
        </div>

        <div className="navbar-end">
          <div className="level is-flex is-justify-content-flex-end">
            {isLoggedIn ? (
              <p className="has-text-primary is-size-7 has-text-centered has-text-weight-bold is-italic mr-3">User Logged In!</p>
            ) : (
                <p className="has-text-primary is-size-7 has-text-centered has-text-weight-bold is-italic mr-3">Guest Account</p>
              )
            }
            <figure className="image is-48x48 menu-avatar">
              {avatar && isLoggedIn ? (
                <img src={`/${avatar}`} />
              ) : (
                  <img src="/images/guestUser.svg" />
                )}
            </figure>

            <div className="navbar-item has-dropdown is-hoverable">
              <a className="navbar-link">
                {isLoggedIn ? userName : 'Guest'}
              </a>

              <div className="navbar-dropdown is-boxed">
                {isLoggedIn &&
                  <>
                    <a href="/mystat" className={menuActive === 'mystats' ? 'navbar-item is-active' : 'navbar-item'}>
                      MyStats
                    </a>
                    <a href="/logged/settings" className={menuActive === 'settings' ? 'navbar-item is-active' : 'navbar-item'}>
                      Account Settings
                    </a>
                    <hr className="navbar-divider" />
                    <a href="/auth/logout" className="navbar-item">
                      Log Out
                    </a>
                  </>
                }

                {!isLoggedIn &&
                  <>
                    <a href="/auth/login" className="navbar-item">
                      Log In
                    </a>
                    <a href="/auth/signup" className="navbar-item">
                      Sign Up
                    </a>
                  </>
                }

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
)

export default Navbar;