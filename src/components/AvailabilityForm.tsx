import { useState } from 'react';
import Image from "next/image";

interface AvailabilityData {
  week: string, symbol: string, selected: boolean, slots: Array<any>
}

interface Availability {
  userId: string;
  data: Array<AvailabilityData>
}

interface AvailabilityFormProps {
  initialData: Availability;
}

const isValidTimeFormat = (time: string) => {
  // Regular expression for validating the time format: HH:MM AM/PM
  // const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])\s(AM|PM)$/;
  const timePattern = /^([01]?[0-9]|2[0-3]):([0-5][0-9])(am|pm)$/;
  return timePattern.test(time);
};


export default function AvailabilityForm({ initialData }: AvailabilityFormProps) {


  const dummyData = [
    { week: "Sunday", symbol: "S", selected: false, slots: [] },
    { week: "Monday", symbol: "M", selected: true, slots: [] },
    { week: "Tuesday", symbol: "T", selected: true, slots: [] },
    { week: "Wednesday", symbol: "W", selected: true, slots: [] },
    { week: "Thursday", symbol: "T", selected: true, slots: [] },
    { week: "Friday", symbol: "F", selected: true, slots: [] },
    { week: "Saturday", symbol: "S", selected: false, slots: [] }
  ]

  const userId = initialData?.userId

  const [weeks, setWeeks] = useState<Array<AvailabilityData>>(initialData?.data?.length == 0 ? dummyData : initialData?.data)

  const [error, setError] = useState<any>({ from: false, to: false, message: null });

  const [selected, setSelected] = useState<any>({ weekIndex: null, slotIndex: null });
  const [newValue, setNewValue] = useState<any>({ from: '', to: '' });


  interface TimeInterval {
    from: string;
    to: string;
  }
  
  function convertToMinutes(timeStr: string): number {
    const period = timeStr.slice(-2);
    let [hours, minutes] = timeStr.slice(0, -2).split(":").map(Number);

    if (period === 'pm' && hours !== 12) {
      hours += 12;
    } else if (period === 'am' && hours === 12) {
      hours = 0;
    }
  
    return hours * 60 + minutes;
  }
  
  function checkOverlap(intervals: TimeInterval[]): boolean {

    const sortedIntervals = intervals.map(interval => ({
      from: convertToMinutes(interval.from),
      to: convertToMinutes(interval.to)
    })).sort((a, b) => a.from - b.from);


    for (let i = 0; i < sortedIntervals.length - 1; i++) {
      if (sortedIntervals[i].to > sortedIntervals[i + 1].from) {
        return true;
      }
    }
  
    return false;

  }
  

  // Handle week selection for slot
  const handleSelect = (weekIndex: number) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[weekIndex].selected = !weeks[weekIndex].selected;
    setWeeks(updatedWeeks);
  };

  // Handle adding a new slot
  const handleAdd = ( weekIndex: number ) => {
    setSelected({ weekIndex: weekIndex, slotIndex: null })
  };


  // Handle adding a new slot
  const handleOk = (weekIndex: number, slotIndex?: number) => {

    if (newValue.from == '' || newValue.to == '') {
      setError({ ...error, message: "Values can not be empty" });
      return;
    };

    if ( convertToMinutes(newValue.from)  > convertToMinutes(newValue.to) ) {
      setError({ ...error, message: "Time slot 'From' time should be less than 'To' time, Please check" });
      return;
    }

    const updatedWeeks = [...weeks];

    const timeArray: TimeInterval[] = [
      ...updatedWeeks[weekIndex].slots,
      newValue
    ];
    
    const hasOverlap = checkOverlap(timeArray);

    if ( hasOverlap ) {
      setError({ ...error, message: "Time slot has over lap, Please check" });
      return;
    }

    if ( slotIndex !== undefined ) {

      updatedWeeks[weekIndex].slots[slotIndex] = { from: newValue.from, to: newValue.to }; // Update slot
    }

    if ( slotIndex == undefined ) {

      updatedWeeks[weekIndex].slots.push({ from: newValue.from, to: newValue.to });

    }

    setWeeks(updatedWeeks)
    handleClear();

  };

  const handleClear = () => {
    setSelected({ weekIndex: null, slotIndex: null });
    setNewValue({ from: '', to: '' });
    setError({ from: false, to: false, message: null })
  };

  // Handle editing a time slot
  const handleEdit = (weekIndex: number, slotIndex: number) => {

    const updatedWeeks = [...weeks];
    const slot = updatedWeeks[weekIndex].slots[slotIndex];

    setSelected({ weekIndex: weekIndex, slotIndex: slotIndex })
    setNewValue({ from: slot.from, to: slot.to })

  };

  // Handle deleting a time slot
  const handleDelete = (weekIndex: number, slotIndex: number) => {
    const updatedWeeks = [...weeks];
    updatedWeeks[weekIndex].slots.splice(slotIndex, 1); // Remove the slot
    setWeeks(updatedWeeks); // Update state
    handleClear();
  };


  const handleSave = async () => {

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, data: weeks }),
      });

      if (response.ok) {
        alert('Availability saved successfully!');
        window.location.reload();
      } else {
        alert('Failed to save availability.');
      }
    } catch (err) {
      console.error(err);
      alert('An error occurred.');
    }

  };

  const handleChange = (value: any, type: string) => {
    setNewValue({ ...newValue, [`${type}`]: value });
    if(isValidTimeFormat(value)){
      setError({ ...error, [`${type}`]: false, message: null })
    }else{
      setError({ ...error, [`${type}`]: true, message: "Invalid Time , formate HH:MMam/pm eg: 10:20am" });
    }
  }



  return (
    <div className='flex flex-col w-full justify-start items-start gap-4 p-4' >

      <h2>Available Weeks</h2>
      <div className='flex flex-row gap-2'>
        {
          weeks.map((item: any, index: number) => {
            return <div key={index} onClick={() => { handleSelect(index) }} className={`w-[30px] h-[30px] cursor-pointer ${item?.selected ? 'bg-blue-500' : 'bg-gray-200'} text-white text-[10px] text-center align-middle leading-[30px] rounded-full`}> {item?.symbol} </div>
          }
          )
        }
      </div>
   
      <div className='flex flex-col w-full gap-4'>

        {
          weeks && weeks.map((item: any, weekIndex: number) => {

            if (!item?.selected) return null;

            return (
              <div key={weekIndex} className='flex flex-row  leading-[30px] gap-4'> <div className='w-[180px]'> {item?.week}</div>
                <div className='flex flex-col gap-2'>

                  {
                    item?.slots.map((slot: any, slotIndex: number) => {

                      if (selected.weekIndex == weekIndex && selected.slotIndex == slotIndex) {
                        return (
                          <div  key={slotIndex} className='flex flex-row px-[4px] rounded-sm'> <input className={`w-[70px] bg-inherit border-solid ${error?.from ? 'border-red-600 border-[1px]' : 'border-blue-500 border-[1px]'}`} onChange={(e) => handleChange(e.target.value, 'from')} value={newValue?.from} placeholder='from' />   &emsp; - &emsp; <input className={`w-[70px] bg-inherit border-solid ${error?.to ? 'border-red-600 border-[1px]' : 'border-blue-500 border-[1px]'}`} onChange={(e) => handleChange(e.target.value, 'to')} value={newValue?.to} placeholder='to' /> <button onClick={() => { handleClear() }} className='ml-[10px] bg-red-400 p-2'>Cancel</button> <button onClick={() => { handleOk(weekIndex, slotIndex) }} className={`ml-[10px]  ${error.message ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-400 cursor-pointer'}  p-2`} disabled={error.message}>OK</button> </div>
                        )
                      }

                      return (

                        <div   key={slotIndex} className='flex flex-row gap-2'>



                          <div className='bg-gray-200 px-[4px] rounded-sm'> <span>{slot.from}</span> &emsp; to &emsp; <span>{slot.to}</span></div>
                          {
                            item?.slots?.length == slotIndex + 1 && (
                              <button onClick={() => handleAdd(weekIndex)}>
                                <Image className='cursor-pointer' src="/add-circle-svgrepo-com.svg"
                                  alt="Add"
                                  width={30}
                                  height={30} />
                              </button>
                            )
                          }

                          <button onClick={() => { handleDelete(weekIndex, slotIndex) }}><Image className='cursor-pointer' src="/minus-circle-svgrepo-com.svg"
                            alt="Delete"
                            width={30}
                            height={30} />
                          </button>

                          <button onClick={() => { handleEdit(weekIndex, slotIndex) }}><Image className='cursor-pointer' src="/file-edit-svgrepo-com.svg"
                            alt="Edit"
                            width={30}
                            height={30} />
                          </button>

                        </div>

                      )
                    })
                  }

                  {item?.slots?.length === 0 && (
                    <button onClick={() => handleAdd(weekIndex)}>
                      <Image className='cursor-pointer' src="/add-circle-svgrepo-com.svg"
                        alt="Add"
                        width={30}
                        height={30} />
                    </button>
                  )
                  }


                  {
                    selected.weekIndex == weekIndex && selected.slotIndex == null && (<div className='flex flex-row px-[4px] rounded-sm'> <input className={`w-[70px] bg-inherit border-solid ${error?.from ? 'border-red-600 border-[1px]' : ''}`} onChange={(e) => handleChange(e.target.value, 'from')} placeholder='from' />   &emsp; - &emsp; <input className={`w-[70px] bg-inherit border-solid ${error?.to ? 'border-red-600 border-[1px]' : ''}`} onChange={(e) => handleChange(e.target.value, 'to')} placeholder='to' /> <button onClick={() => { handleClear() }} className='ml-[10px] bg-red-400 p-2'>Cancel</button> <button onClick={() => { handleOk(weekIndex) }} className={`ml-[10px]  ${error.message ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-400 cursor-pointer'}  p-2`} disabled={error.message}>OK</button> </div>)
                  }

                  {
                    selected.weekIndex == weekIndex && (error?.message ? <div className='text-red-500'> {error?.message} </div> : '')
                  }

                </div>
              </div>
            )
          })
        }

      </div>



      <button className={`${(error.message || selected.weekIndex !== null) ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-500 cursor-pointer'} p-2`} disabled={error.message || selected.weekIndex !== null} onClick={handleSave}>Save</button>

    </div>
  );
}

