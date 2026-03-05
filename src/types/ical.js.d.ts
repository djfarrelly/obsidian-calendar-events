declare module 'ical.js' {
	namespace ICAL {
		function parse(input: string): any;

		class Component {
			constructor(jCal: any | string);
			getAllSubcomponents(name?: string): Component[];
			getAllProperties(name?: string): Property[];
			getFirstPropertyValue(name?: string): any;
		}

		class Event {
			constructor(component?: Component);
			uid: string;
			summary: string;
			description: string;
			location: string;
			startDate: Time;
			endDate: Time;
			duration: Duration;
			isRecurring(): boolean;
			iterator(): RecurExpansion;
		}

		class Time {
			isDate: boolean;
			toJSDate(): Date;
		}

		class Duration {
			toSeconds(): number;
		}

		class Property {
			getParameter(name: string): string | undefined;
			getFirstValue(): any;
		}

		interface RecurExpansion {
			next(): Time | null;
		}
	}

	export default ICAL;
}
