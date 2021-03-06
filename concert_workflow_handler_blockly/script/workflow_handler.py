#!/usr/bin/env python
#
# License: BSD
#   https://raw.github.com/robotics-in-concert/concert_workflow_engine/license/LICENSE
#
##############################################################################
# Imports
##############################################################################

import rospy
import concert_service_utilities
import concert_workflow_handler_blockly
import rospkg
import rocon_python_comms
from concert_software_farmer import SoftwareFarmClient, FailedToStartSoftwareException
##############################################################################
# Main
##############################################################################
if __name__ == '__main__':
    rospy.init_node('workflow_handler_blockly', anonymous=True)
    service_name = rospy.get_param('name', '')
    wf = rospy.get_param('workflows', '')
    sfc = None
    try:
        sfc = SoftwareFarmClient()
        success, namespace, _unused_parameters = sfc.allocate("concert_workflow_engine_blockly/workflow_engine_blockly")
        if not success:
            raise FailedToStartSoftwareException("Failed to allocate software")
        wf_handler = concert_workflow_handler_blockly.WorkflowHandlerBlockly(service_name, wf, namespace)
        rospy.on_shutdown(wf_handler.shutdown)
        # rospy.on_shutdown(lambda : sfc.deallocate("concert_workflow_engine_blockly/workflow_engine_blockly"))
        wf_handler.spin()

    except (FailedToStartSoftwareException, rospkg.ResourceNotFound, rocon_python_comms.exceptions.NotFoundException) as e:
        rospy.logerr("Workflows Handler Blockly : %s" % str(e))

    print 'Workflows Handler Blockly : Bye Bye'