import React, { useEffect } from 'react';
import anime from 'animejs';

const AnimatedShapes = () => {
    useEffect(() => {
        anime({
            targets: '.shape',
            translateX: () => anime.random(-30, 30),
            translateY: () => anime.random(-30, 30),
            scale: () => anime.random(0.5, 1.5),
            rotate: () => anime.random(0, 360),
            duration: 5000,
            direction: 'alternate',
            easing: 'easeInOutQuad',
            loop: true,
        });
    }, []);

    return (
        <div className="background-shapes">
            {[...Array(10)].map((_, index) => (
                <div
                    key={index}
                    className="shape"
                    style={{
                        width: `${anime.random(50, 150)}px`,
                        height: `${anime.random(50, 150)}px`,
                        top: `${anime.random(0, 100)}%`,
                        left: `${anime.random(0, 100)}%`,
                        backgroundColor: `rgba(255, 255, 255, 0.${anime.random(2, 4)})`,
                    }}
                ></div>
            ))}
        </div>
    );
};

export default AnimatedShapes;
