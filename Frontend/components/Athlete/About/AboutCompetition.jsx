import "./AboutCompetition.css";

const AboutCompetition = () => {
  return (
    <section id="competition" className="about">
      <div className="about__container">

        <span className="section-tag">
          ABOUT THE CHAMPIONSHIP
        </span>


        <p>
          The Surat District Weightlifting Championship is the official
          district-level competition organized by the
          <strong> Surat District Weightlifting Association </strong>,
          affiliated with the
          <strong> Gujarat State Weightlifting Association </strong>.
        </p>

        <p>
          The championship provides athletes with an opportunity to
          compete at the district level, qualify for higher-level
          championships, and represent Surat in state competitions.
        </p>

        <div className="about__cards">

          <div className="about__card">
            <h3>🏋️ Official Event</h3>
            <p>Organized by SDWA</p>
          </div>

          <div className="about__card">
            <h3>🥇 Categories</h3>
            <p>Youth • Junior • Senior</p>
          </div>

          <div className="about__card">
            <h3>📈 Progression</h3>
            <p>Gateway to State Championships</p>
          </div>

          <div className="about__card">
            <h3>⚖️ Fair Competition</h3>
            <p>Conducted under official rules</p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default AboutCompetition;