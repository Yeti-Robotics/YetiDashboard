// Define UI elements
let ui = {
  timer: document.getElementById("timer"),
  robotState: document.getElementById("robot-state").firstChild,
  gyro: {
    container: document.getElementById("gyro"),
    val: 0,
    offset: 0,
    visualVal: 0,
    arm: document.getElementById("gyro-arm"),
    number: document.getElementById("gyro-number")
  },
  lineFollowingButtons: {
    leftSensor: document.getElementById("Left"),
    midSensor: document.getElementById("Center"),
    rightSensor: document.getElementById("Right")
  },
  robotDiagram: {
    arm: {
      element: document.getElementById("robot-arm"),
      elevatorHeight: 0,
      armAngle: 0
    }
  },
  autoSelect: document.getElementById("auto-select"),
  armPosition: document.getElementById("arm-position"),
  elevatorPosition: document.getElementById("elevator-position"),
  visionTarget: document.getElementById("vision-target"),
  ballIndicator: document.getElementById("ball")
};

// Key Listeners

// Gyro rotation
NetworkTables.addKeyListener('/SmartDashboard/drive/navx/yaw', (key, value) => {
    ui.gyro.val = value;
    ui.gyro.visualVal = Math.floor(ui.gyro.val - ui.gyro.offset);
    ui.gyro.visualVal %= 360;
    if (ui.gyro.visualVal < 0) {
        ui.gyro.visualVal += 360;
    }
    ui.gyro.arm.style.transform = `rotate(${ui.gyro.visualVal}deg)`;
    ui.gyro.number.innerHTML = ui.gyro.visualVal + 'º';
});

// // The following case is an example, for a robot with an arm at the front.
NetworkTables.addKeyListener('/SmartDashboard/arm/encoder', (key, value) => {
    var armAngle = value;
    // // Calculate visual rotation of arm
    // // Rotate the arm in diagram to match real arm
    // ui.robotDiagram.arm.style.transform = `rotate(${armAngle}deg`;
    ui.robotDiagram.arm.armAngle = armAngle;
    updateRobotDiagram(ui.robotDiagram.arm.elevatorHeight, ui.robotDiagram.arm.armAngle);
});
//The following case is an example, for a robot with an arm at the front.
NetworkTables.addKeyListener('/SmartDashboard/elevator/encoder', (key, value) => {
    // map 0-59 to 5-150
    // (((y - minVal) / (maxVal - minVal)) * (maxPixel - minPixel)) + minPixel
    value = (((value - 0) / (59 - 0)) * (150 - 5)) + 5
    value *= -1;
    value += 90;
    // // Rotate the arm in diagram to match real arm
    // ui.robotDiagram.arm.style.transform = `translateY(${value}px)`;
    ui.robotDiagram.arm.elevatorHeight = value;
    updateRobotDiagram(ui.robotDiagram.arm.elevatorHeight, ui.robotDiagram.arm.armAngle);
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/autonomous/modes', (key, value) => {
    // Clear previous list
    while (ui.autoSelect.firstChild) {
        ui.autoSelect.removeChild(ui.autoSelect.firstChild);
    }
    // Make an option for each autonomous mode and put it in the selector
    for (let i = 0; i < value.length; i++) {
        var option = document.createElement('option');
        option.appendChild(document.createTextNode(value[i]));
        ui.autoSelect.appendChild(option);
    }
    // Set value to the already-selected mode. If there is none, nothing will happen.
    ui.autoSelect.value = NetworkTables.getValue('/SmartDashboard/currentlySelectedMode');
});

// Load list of prewritten autonomous modes
NetworkTables.addKeyListener('/SmartDashboard/autonomous/selected', (key, value) => {
    ui.autoSelect.value = value;
});

// Shows if vision system has found target
NetworkTables.addKeyListener('/SmartDashboard/vision/targetFound', (key, value) => {
    if (value) {
        ui.visionTarget.classList.add('sensortrue');
        ui.visionTarget.classList.remove('sensorfalse');
    } else {
        ui.visionTarget.classList.add('sensorfalse');
        ui.visionTarget.classList.remove('sensortrue');
    }
});

// Left Line Following Indicator
NetworkTables.addKeyListener('/SmartDashboard/lineFollower/left', (key, value) => {
    if (value) {
        ui.lineFollowingButtons.leftSensor.classList.add('btn-success');
        ui.lineFollowingButtons.leftSensor.classList.remove('btn-danger');
    } else {
        ui.lineFollowingButtons.leftSensor.classList.add('btn-danger');
        ui.lineFollowingButtons.leftSensor.classList.remove('btn-success');
    }
});

// Center Line Following Indicator
NetworkTables.addKeyListener('/SmartDashboard/lineFollower/center', (key, value) => {
    if (value) {
        ui.lineFollowingButtons.midSensor.classList.add('btn-success');
        ui.lineFollowingButtons.midSensor.classList.remove('btn-danger');
    } else {
        ui.lineFollowingButtons.midSensor.classList.add('btn-danger');
        ui.lineFollowingButtons.midSensor.classList.remove('btn-success');
    }
    console.log("center changed")
});

// Right Line Following Indicator
NetworkTables.addKeyListener('/SmartDashboard/lineFollower/right', (key, value) => {
    if (value) {
        ui.lineFollowingButtons.rightSensor.classList.add('btn-success');
        ui.lineFollowingButtons.rightSensor.classList.remove('btn-danger');
    } else {
        ui.lineFollowingButtons.rightSensor.classList.add('btn-danger');
        ui.lineFollowingButtons.rightSensor.classList.remove('btn-success');
    }
});

// Ball Indicator
NetworkTables.addKeyListener('/SmartDashboard/arm/ball', (key, value) => {
    if (value) {
        ui.ballIndicator.classList.add('sensortrue');
        ui.ballIndicator.classList.remove('sensorfalse');
    } else {
        ui.ballIndicator.classList.add('sensorfalse');
        ui.ballIndicator.classList.remove('sensortrue');
    }
});

// // The rest of the doc is listeners for UI elements being clicked on
// ui.example.button.onclick = function() {
//     // Set NetworkTables values to the opposite of whether button has active class.
//     NetworkTables.putValue('/SmartDashboard/example_variable', this.className != 'active');
// };
// Reset gyro value to 0 on click
ui.gyro.container.onclick = function() {
    // Store previous gyro val, will now be subtracted from val for callibration
    ui.gyro.offset = ui.gyro.val;
    // Trigger the gyro to recalculate value.
    updateGyro('/SmartDashboard/drive/navx/yaw', ui.gyro.val);
};
// Update NetworkTables when autonomous selector is changed
ui.autoSelect.onchange = function() {
    NetworkTables.putValue('/SmartDashboard/autonomous/selected', this.value);
};
// Get value of arm height slider when it's adjusted
// ui.armPosition.oninput = function() {
//     NetworkTables.putValue('/SmartDashboard/arm/encoder', parseInt(this.value));
// };
// // Get value of elevator height slider when it's adjusted
// ui.elevatorPosition.oninput = function() {
//     NetworkTables.putValue('/SmartDashboard/elevator/encoder', parseInt(this.value));
// };
addEventListener('error',(ev)=>{
    ipc.send('windowError',{mesg:ev.message,file:ev.filename,lineNumber:ev.lineno});
})
function updateRobotDiagram (elevatorHeight, armAngle) {
    ui.robotDiagram.arm.element.style.transform = `translateY(${elevatorHeight}px) rotate(${armAngle}deg`;
}
