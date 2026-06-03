.PHONY: start android ios web lint fix typecheck check

start:
	npm start

android:
	npm run android

ios:
	npm run ios

web:
	npm run web

lint:
	npm run lint

fix:
	npm run lint -- --fix

typecheck:
	npm run typecheck

check: lint typecheck
