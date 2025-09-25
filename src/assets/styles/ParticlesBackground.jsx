import React from "react";
import Particles from "react-tsparticles";

const ParticlesBackground = () => {
    return (
        <Particles
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
            options={{
                fpsLimit: 60,
                background: {
                    color: "#1e3c34", // Couleur de fond de base (peut être transparente si tu veux)
                },
                interactivity: {
                    detectsOn: "canvas",
                    events: {
                        onHover: {
                            enable: true,
                            mode: "repulse",
                        },
                        onClick: {
                            enable: true,
                            mode: "push",
                        },
                        resize: true,
                    },
                    modes: {
                        repulse: {
                            distance: 100,
                            duration: 0.4,
                        },
                        push: {
                            quantity: 4,
                        },
                    },
                },
                particles: {
                    color: {
                        value: ["#a3d9a5", "#34503b", "#4b986c"], // teintes vert clair/blanc
                    },
                    links: {
                        enable: true,
                        distance: 120,
                        color: "#4b986c",
                        opacity: 0.3,
                        width: 1,
                    },
                    collisions: {
                        enable: false,
                    },
                    move: {
                        direction: "none",
                        enable: true,
                        outMode: "bounce",
                        random: true,
                        speed: 0.7,
                        straight: false,
                    },
                    number: {
                        density: {
                            enable: true,
                            area: 900,
                        },
                        value: 40,
                    },
                    opacity: {
                        value: 0.6,
                        random: true,
                        anim: {
                            enable: true,
                            speed: 0.5,
                            opacity_min: 0.2,
                            sync: false,
                        },
                    },
                    shape: {
                        type: "circle",
                    },
                    size: {
                        random: true,
                        value: 3,
                        anim: {
                            enable: true,
                            speed: 2,
                            size_min: 0.5,
                            sync: false,
                        },
                    },
                },
                detectRetina: true,
            }}
        />
    );
};

export default ParticlesBackground;
