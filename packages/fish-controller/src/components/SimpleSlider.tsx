type SliderCommonProps = {
	id: string;
	label: string;
	min: number;
	max: number;
	step: number;
	value: number;
	onChange: (value: number) => void;
};
export function SimpleSlider({
	id,
	label,
	min,
	max,
	step,
	value,
	onChange,
}: SliderCommonProps) {
	return (
		<div>
			<label htmlFor={id}>
				{label} ({value})
			</label>
			<input
				id={id}
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(event) => {
					onChange(Number.parseFloat(event.target.value));
				}}
			/>
		</div>
	);
}
