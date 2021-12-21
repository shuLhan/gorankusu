export const CLASS_INPUT_LABEL = "trunks_input_label"
export const CLASS_INPUT = "trunks_input"
export const CLASS_NAV_LINK = "nav_link"
export const CLASS_NAV_TARGET = "nav_target"

export const HASH_ENVIRONMENT = "environment"
export const HASH_LINKS = "links"

export const FormInputKindNumber = "number"
export const FormInputKindString = "string"

export interface AttackOptionsInterface {
	Duration: number
	RatePerSecond: number
	Timeout: number
}

export interface AttackResult {
	TargetID: string
	HttpTargetID: string
	Name: string
	TextReport: string
	HistReport: string
}

export interface EnvironmentInterface {
	ListenAddress: string
	WebSocketListenPort: number
	MaxAttackDuration: number
	MaxAttackRate: number
	ResultsDir: string
	ResultsSuffix: string
	AttackRunning: RunRequestInterface | null
}

export interface FormInput {
	label: string
	hint: string
	kind: string
	value: string
	max?: number
	min?: number
}

export interface HttpResponseInterface {
	code: number
	message: string
	data?: any
}

export interface HttpTargetInterface {
	Name: string
	Hint?: string
	ID: string
	Method: number
	Path: string
	RequestType: number
	Headers: KeyFormInput
	Params: KeyFormInput
	Results: AttackResult[]
	AllowAttack: boolean
	IsCustomizable: boolean
}

export interface KeyFormInput {
	[key: string]: FormInput
}

export interface MapIdTarget {
	[key: string]: TargetInterface
}

export interface MapNumberString {
	[key: number]: string
}

export interface NavLinkInterface {
	ID: string
	Text: string
	Href: string
	OpenInIFrame: boolean
}

export interface RunRequestInterface {
	Target: TargetInterface
	HttpTarget: HttpTargetInterface | null
	WebSocketTarget: WebSocketTargetInterface | null
	Result?: AttackResult | null
}

export interface RunResponseInterface {
	DumpRequest: string
	DumpResponse: string
	ResponseStatus: string
	ResponseStatusCode: number
	ResponseType: string
	ResponseBody: string
}

export interface TargetInterface {
	ID: string
	Name: string
	Hint?: string
	BaseUrl: string
	Opts: AttackOptionsInterface
	Vars: KeyFormInput
	HttpTargets: HttpTargetInterface[]
	WebSocketTargets: WebSocketTargetInterface[]
}

export interface TrunksInterface {
	AttackHttp(
		target: TargetInterface,
		http_target: HttpTargetInterface,
	): Promise<HttpResponseInterface | null>

	AttackHttpDelete(name: string): Promise<HttpResponseInterface | null>

	AttackHttpGet(name: string): Promise<HttpResponseInterface>

	ContentRenderer(
		target: TargetInterface,
		http_target: HttpTargetInterface | null,
		ws_target: WebSocketTargetInterface | null,
		nav_link: NavLinkInterface | null,
		el: HTMLElement,
	): void

	SetContent(path: string, el: HTMLElement | null): void

	RunHttp(
		target: TargetInterface,
		http_target: HttpTargetInterface,
	): Promise<RunResponseInterface | null>

	RunWebSocket(
		target: TargetInterface,
		WebSocketTargetInterface: WebSocketTargetInterface,
	): Promise<HttpResponseInterface | null>
}

export interface WebSocketTargetInterface {
	ID: string
	Name: string
	Hint?: string
	Headers: KeyFormInput
	Params: KeyFormInput
}
