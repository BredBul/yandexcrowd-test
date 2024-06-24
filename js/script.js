function ticker(element, speed) {
	const clone = element.innerHTML;
	const firstElement = element.children[0];
	let i = 0;
	element.insertAdjacentHTML("beforeend", clone);

	function animate() {
		firstElement.style.marginLeft = `-${i}px`;
		if (i > firstElement.clientWidth) {
			i = 0;
		}
		i += speed;
		requestAnimationFrame(animate);
	}

	animate();
}

class Slider {
	constructor(selector, options) {
		this.slider = document.querySelector(selector);
		this.wrapper = this.slider.querySelector(".slider-wrapper");
		this.slides = Array.from(this.wrapper.children);
		this.currentSlide = 0;

		this.options = Object.assign(
			{
				slidesToShow: 1,
				slidesToScroll: 1,
				speed: 500,
				gap: 0,
				pagination: false,
				dots: false,
				arrows: false,
				loop: false,
				autoSlide: false,
				autoSlideSpeed: 3000,
				prevArrowSelector: null,
				nextArrowSelector: null,
				dotsSelector: null,
				paginationSelector: null,
				breakpoints: {},
			},
			options
		);

		this.startX = null;
		this.startY = null;
		this.currentX = null;
		this.currentY = null;
		this.moving = false;

		this.init();
	}

	init() {
		this.setupSlides();
		if (this.options.arrows) this.initArrows();
		if (this.options.dots) this.initDots();
		if (this.options.pagination) this.initPagination();
		if (this.options.autoSlide) this.startAutoSlide();
		this.addTouchEvents();
		this.addResizeEvent();
	}

	setupSlides() {
		const windowWidth = window.innerWidth;

		for (let breakpoint in this.options.breakpoints) {
			if (windowWidth >= breakpoint) {
				const breakpointOptions = this.options.breakpoints[breakpoint];
				this.options = Object.assign({}, this.options, breakpointOptions);
			}
		}

		const slideWidth =
			this.slider.clientWidth / this.options.slidesToShow - this.options.gap;
		this.slides.forEach(slide => {
			slide.style.minWidth = `${slideWidth}px`;
			slide.style.marginRight = `${this.options.gap}px`;
		});
		this.updateSlidePosition();
		this.updateArrows();
		this.updateDots();
		this.updatePagination();
	}

	initArrows() {
		const prevArrow = this.options.prevArrowSelector
			? this.slider.querySelector(this.options.prevArrowSelector)
			: null;
		const nextArrow = this.options.nextArrowSelector
			? this.slider.querySelector(this.options.nextArrowSelector)
			: null;

		if (prevArrow && nextArrow) {
			prevArrow.addEventListener("click", () => this.prevSlide());
			nextArrow.addEventListener("click", () => this.nextSlide());

			this.updateArrows();
		}
	}

	initDots() {
		const dotsContainer = this.options.dotsSelector
			? this.slider.querySelector(this.options.dotsSelector)
			: null;
		if (dotsContainer) {
			this.slides.forEach((_, index) => {
				const dot = document.createElement("button");
				dot.classList.add("slider-dot");
				dot.addEventListener("click", () => this.goToSlide(index));
				dotsContainer.appendChild(dot);
			});
			this.updateDots();
		}
	}

	initPagination() {
		this.paginationSelector = this.options.paginationSelector
			? this.slider.querySelector(this.options.paginationSelector)
			: null;
		if (this.paginationSelector) {
			this.updatePagination();
		}
	}

	updatePagination() {
		if (this.paginationSelector) {
			const totalSlides = this.slides.length;
			const currentSlide = Math.min(
				this.currentSlide + this.options.slidesToScroll,
				totalSlides
			);

			this.paginationSelector.innerHTML = `
				<span class="slider-pagination__current">${currentSlide}</span>
				/
				<span class="slider-pagination__total">${totalSlides}</span>
			`;
		}
	}

	updateDots() {
		const dots = this.options.dotsSelector
			? this.slider.querySelectorAll(`${this.options.dotsSelector} button`)
			: [];
		dots.forEach((dot, index) => {
			dot.classList.toggle("active", index === this.currentSlide);
		});
	}

	startAutoSlide() {
		this.autoSlideInterval = setInterval(() => {
			this.nextSlide();
		}, this.options.autoSlideSpeed);
	}

	updateArrows() {
		const prevArrow = this.options.prevArrowSelector
			? this.slider.querySelector(this.options.prevArrowSelector)
			: null;
		const nextArrow = this.options.nextArrowSelector
			? this.slider.querySelector(this.options.nextArrowSelector)
			: null;

		if (prevArrow && nextArrow) {
			if (this.currentSlide === 0 && !this.options.loop) {
				prevArrow.querySelector("button").setAttribute("disabled", "disabled");
			} else {
				prevArrow.querySelector("button").removeAttribute("disabled");
			}

			if (
				this.currentSlide >= this.slides.length - this.options.slidesToShow &&
				!this.options.loop
			) {
				nextArrow.querySelector("button").setAttribute("disabled", "disabled");
			} else {
				nextArrow.querySelector("button").removeAttribute("disabled");
			}
		}
	}

	nextSlide() {
		if (this.currentSlide < this.slides.length - this.options.slidesToShow) {
			this.currentSlide += this.options.slidesToScroll;
			if (this.currentSlide > this.slides.length - this.options.slidesToShow) {
				this.currentSlide = this.slides.length - this.options.slidesToShow;
			}
		} else if (this.options.loop) {
			this.currentSlide = 0;
		}
		this.updateSlidePosition();
		this.updateDots();
		this.updatePagination();
		this.updateArrows();
	}

	prevSlide() {
		if (this.currentSlide > 0) {
			this.currentSlide -= this.options.slidesToScroll;
			if (this.currentSlide < 0) {
				this.currentSlide = 0;
			}
		} else if (this.options.loop) {
			this.currentSlide = this.slides.length - this.options.slidesToShow;
		}
		this.updateSlidePosition();
		this.updateDots();
		this.updatePagination();
		this.updateArrows();
	}

	updateSlidePosition() {
		const offset =
			this.currentSlide * (this.slider.clientWidth / this.options.slidesToShow);
		this.wrapper.style.transition = `transform ${this.options.speed}ms ease`;
		this.wrapper.style.transform = `translateX(-${offset}px)`;
	}

	addTouchEvents() {
		this.handleTouchStartBound = this.handleTouchStart.bind(this);
		this.handleTouchMoveBound = this.handleTouchMove.bind(this);
		this.handleTouchEndBound = this.handleTouchEnd.bind(this);

		this.slider.addEventListener(
			"touchstart",
			this.handleTouchStartBound,
			false
		);
		this.slider.addEventListener("touchmove", this.handleTouchMoveBound, false);
		this.slider.addEventListener("touchend", this.handleTouchEndBound, false);
	}

	handleTouchStart(evt) {
		this.startX = evt.touches[0].clientX;
		this.startY = evt.touches[0].clientY;
		this.moving = true;
		this.wrapper.style.transition = "none";
	}

	handleTouchMove(evt) {
		if (!this.moving) return;

		this.currentX = evt.touches[0].clientX;
		this.currentY = evt.touches[0].clientY;

		const xDiff = this.startX - this.currentX;
		const yDiff = this.startY - this.currentY;

		if (Math.abs(xDiff) > Math.abs(yDiff)) {
			if (xDiff > 0) {
				this.nextSlide();
			} else {
				this.prevSlide();
			}
		}

		this.startX = null;
		this.startY = null;
		this.moving = false;
	}

	handleTouchEnd() {
		this.wrapper.style.transition = `transform ${this.options.speed}ms ease`;
		this.updateSlidePosition();
	}

	addResizeEvent() {
		this.setupSlidesBound = this.setupSlides.bind(this);

		window.addEventListener("resize", this.setupSlidesBound);
	}

	destroy() {
		this.slider.removeEventListener("touchstart", this.handleTouchStartBound);
		this.slider.removeEventListener("touchmove", this.handleTouchMoveBound);
		this.slider.removeEventListener("touchend", this.handleTouchEndBound);
		window.removeEventListener("resize", this.setupSlidesBound);

		this.slides.forEach(slide => {
			slide.style.minWidth = "";
			slide.style.marginRight = "";
		});

		this.wrapper.style.transition = "";
		this.wrapper.style.transform = "";

		if (this.options.arrows) {
			const prevArrow = this.options.prevArrowSelector
				? this.slider.querySelector(this.options.prevArrowSelector)
				: null;
			const nextArrow = this.options.nextArrowSelector
				? this.slider.querySelector(this.options.nextArrowSelector)
				: null;

			if (prevArrow) {
				prevArrow.removeEventListener("click", this.prevSlideBound);
			}
			if (nextArrow) {
				nextArrow.removeEventListener("click", this.nextSlideBound);
			}
		}

		if (this.options.dots) {
			const dotsContainer = this.options.dotsSelector
				? this.slider.querySelector(this.options.dotsSelector)
				: null;
			if (dotsContainer) dotsContainer.innerHTML = "";
		}

		if (this.options.pagination) {
			const paginationContainer = this.options.paginationSelector
				? this.slider.querySelector(this.options.paginationSelector)
				: null;
			if (paginationContainer) paginationContainer.innerHTML = "";
		}

		if (this.options.autoSlide) {
			clearInterval(this.autoSlideInterval);
		}
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const tickerElements = document.querySelectorAll(".ticker__container");
	const speed = 0.75;

	tickerElements.forEach(element => {
		ticker(element, speed);
	});

	let init = false;
	let sliderStages;

	function handleSliderInit() {
		if (window.innerWidth <= 768) {
			if (!init) {
				init = true;
				sliderStages = new Slider("#slider-stages", {
					slidesToShow: 1,
					speed: 500,
					gap: 0,
					dots: true,
					dotsSelector: ".slider-stages__dots",
					arrows: true,
					prevArrowSelector: ".slider-stages__prev",
					nextArrowSelector: ".slider-stages__next",
				});
			}
		} else if (init) {
			sliderStages.destroy();
			init = false;
		}
	}

	handleSliderInit();

	const sliderParticipants = new Slider("#slider-participants", {
		slidesToShow: 1,
		speed: 500,
		gap: 0,
		loop: true,
		pagination: true,
		paginationSelector: ".slider-participants__pagination",
		arrows: true,
		prevArrowSelector: ".slider-participants__prev",
		nextArrowSelector: ".slider-participants__next",
		breakpoints: {
			767: {
				gap: 20,
				slidesToShow: 3,
				slidesToScroll: 3,
			},
		},
	});

	window.addEventListener("resize", handleSliderInit);
});
