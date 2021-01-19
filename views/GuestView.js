import React from 'react'
import HeadTemplate from './templates/HeadTemplate';
import Navbar from './templates/Navbar';

const GuestView = ({ userName, title }) => (
  <HeadTemplate
    title={title}
  >
    <Navbar userName={userName} />
    <section className="section">
      <div className="container is-widescreen">
        <div className="columns is-centered mt-5">
          <div className="column is-half">
            <div className="notification is-warning">
              <button className="delete"></button>
              <div className="block">
                You are not signed in.
          </div>
              <div className="block">
                You can play as a guest however after signed in you will have full statistics and comparisions to the other players.
          </div>
              <div className="block">
                To play as a guest just put your nick-name on and press <b>start</b> or use <b>log in</b> / <b>sign on</b> buttons.
          </div>
            </div>
            <div className="box">
  
              <form className="fled" method="POST" action="/game/prepare">
                <label className="label" htmlFor="nick">my nick-name is:</label>
                <div className="control">
                  <input className="input is-primary" name="name" id="nick" type="text" placeholder="nick" />
                </div>
                <button type="submit" className="button is-primary">start game</button>
              </form>
            </div>
            <div className="box">
              <p className="subtitle">I have an account:</p>
              <button className="button is-primary">Log In</button>
              <p className="subtitle">I don't have an account and I want one:</p>
              <button className="button is-primary">Sign On</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </HeadTemplate>
)

export default GuestView;