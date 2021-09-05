export const CLASS_INPUT_LABEL = "trunks_input_label"
export const CLASS_INPUT = "trunks_input"
export const CLASS_NAV_TARGET = "nav_target"

export const HASH_ENVIRONMENT = "environment"

export interface AttackOptionsInterface {
	Duration: number
	RatePerSecond: number
	Timeout: number
}

export interface EnvironmentInterface {
	ListenAddress: string
	MaxAttackDuration: number
	MaxAttackRate: number
	ResultsDir: string
	ResultsSuffix: string
	AttackRunning: RunRequestInterface | null
}

export interface HttpResponseInterface {
	code: number
	message: string
	data?: any
}

export interface HttpTargetInterface {
	Name: string
	ID: string
	Method: number
	Path: string
	RequestType: number
	Headers: KeyValue
	Params: KeyValue
	Results: ResultInterface[]
	AllowAttack: boolean
	IsCustomizable: boolean
}

export interface KeyValue {
	[key: string]: string
}

export interface MapIdTarget {
	[key: string]: TargetInterface
}

export interface MapNumberString {
	[key: number]: string
}

export interface ResultInterface {
	Name: string
	TextReport: string
	HistReport: string
}

export interface RunRequestInterface {
	Target: TargetInterface
	HttpTarget: HttpTargetInterface | null
	WebSocketTarget: WebSocketTargetInterface | null
}

export interface RunResponseInterface {
	DumpRequest: string
	DumpResponse: string
	ResponseType: string
	ResponseBody: string
}

export interface TargetInterface {
	ID: string
	Name: string
	BaseUrl: string
	Opts: AttackOptionsInterface
	Vars: KeyValue
	HttpTargets: HttpTargetInterface[]
	WebSocketTargets: WebSocketTargetInterface[]
}

export interface TrunksInterface {
	AttackHttp(
		target: TargetInterface,
		http_target: HttpTargetInterface,
	): Promise<HttpResponseInterface>

	AttackHttpDelete(name: string): Promise<HttpResponseInterface | null>

	AttackHttpGet(name: string): Promise<HttpResponseInterface>

	ContentRenderer(
		target: TargetInterface,
		http_target: HttpTargetInterface | null,
		ws_target: WebSocketTargetInterface | null,
		el: HTMLElement,
	): void

	SetContent(path: string, el: HTMLElement): void

	RunHttp(
		target: TargetInterface,
		http_target: HttpTargetInterface,
	): Promise<HttpResponseInterface>

	RunWebSocket(
		target: TargetInterface,
		WebSocketTargetInterface: WebSocketTargetInterface,
	): Promise<HttpResponseInterface>
}

export interface WebSocketTargetInterface {
	Name: string
	ID: string
	Headers: KeyValue
	Params: KeyValue
}
