import { useEffect, useMemo, useState } from "react";

const CHARACTERS = [
  { src: "/images/cat.png", alt: "고양이 로딩 캐릭터" },
  { src: "/images/dog.png", alt: "강아지 로딩 캐릭터" },
  { src: "/images/rabbit.png", alt: "토끼 로딩 캐릭터" },
  { src: "/images/peng.png", alt: "펭귄 로딩 캐릭터" },
  { src: "/images/dino.png", alt: "공룡 로딩 캐릭터" },
];

const CHARACTER_MOTIONS = ["bounce", "float", "swing", "spin", "slide"];

function getRandomItem(list = []) {
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

export default function LoadingScreen({
  fullScreen = false,
  overlay = false,
  text = "로딩 중...",
  subText = "조금만 기다려주세요!",
}) {
  const [character, setCharacter] = useState(CHARACTERS[0]);
  const [characterMotion, setCharacterMotion] = useState("bounce");

  useEffect(() => {
    setCharacter(getRandomItem(CHARACTERS) || CHARACTERS[0]);
    setCharacterMotion(getRandomItem(CHARACTER_MOTIONS) || "bounce");
  }, []);

  const rootClassName = useMemo(() => {
    const list = ["loading-screen"];
    if (fullScreen) list.push("loading-screen--fullscreen");
    if (overlay) list.push("loading-screen--overlay");
    return list.join(" ");
  }, [fullScreen, overlay]);

  return (
    <div className={rootClassName}>
      <div className="loading-screen__card">
        <div className="loading-screen__bg loading-screen__bg--1" />
        <div className="loading-screen__bg loading-screen__bg--2" />
        <div className="loading-screen__bg loading-screen__bg--3" />

        <div className="loading-screen__spark loading-screen__spark--a">✦</div>
        <div className="loading-screen__spark loading-screen__spark--b">●</div>
        <div className="loading-screen__spark loading-screen__spark--c">✿</div>
        <div className="loading-screen__spark loading-screen__spark--d">●</div>

        <div
          className={`loading-screen__character loading-screen__character--${characterMotion}`}
        >
          <img src={character.src} alt={character.alt} />
        </div>

        <div className="loading-screen__text">{text}</div>
        <div className="loading-screen__subtext">{subText}</div>

        <div className="loading-screen__spinner-wrap">
          <div className="loading-screen__spinner" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, idx) => (
              <span
                key={idx}
                className="loading-screen__spinner-dot"
                style={{ "--i": idx }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}